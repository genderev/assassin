const p = require('path').posix
const { EventEmitter } = require('events')

const hypertrie = require('hypertrie')
const HypercoreProtocol = require('hypercore-protocol')
const hypercoreCrypto = require('hypercore-crypto')
const thunky = require('thunky')
const nanoiterator = require('nanoiterator')
const toStream = require('nanoiterator/to-stream')
const isOptions = require('is-options')
const unixify = require('unixify')
const Nanoresource = require('nanoresource/emitter')

const { Mount } = require('./lib/messages')

const Flags = {
  MOUNT: 1
}
const MOUNT_PREFIX = '/mounts'
const OWNER = Symbol('mountable-hypertrie-owner')

class MountableHypertrie extends Nanoresource {
  constructor (corestore, key, opts = {}) {
    super()
    if (key && (typeof key === 'string')) key = Buffer.from(key, 'hex')

    this.corestore = corestore
    this.key = key
    this.discoveryKey = this.key ? hypercoreCrypto.discoveryKey(this.key) : null
    this.opts = opts
    this.sparse = opts.sparse !== false

    if (opts.valueEncoding) throw new Error('MountableHypertrie does not currently support a valueEncoding option.')

    var feed = this.opts.feed
    if (!feed) feed = this.corestore.default({ key, ...this.opts })

    if (feed[OWNER]) {
      this.trie = feed[OWNER]
    } else {
      this.trie = opts.trie || hypertrie(null, {
        ...opts,
        feed,
        version: null,
        alwaysUpdate: true,
        alwaysReconnect: true
      })
      this.trie.feed[OWNER] = this.trie
    }
    if (opts.version) {
      this.trie = this.trie.checkout(opts.version)
    }

    this._unlisteners = []

    this.feed = this.trie.feed
    if (this.trie !== opts.trie) {
      const errorListener = err => this.emit('error', err)
      this.trie.on('error', errorListener)
      this._unlisteners.push(() => this.trie.removeListener('error', errorListener))
    }

    // TODO: Replace with a LRU cache.
    this._tries = new Map()
    this._checkouts = new Map()

    this.once('close', () => {
      for (const unlisten of this._unlisteners) {
        unlisten()
      }
      this._unlisteners = []
    })
  }

  ready (cb) {
    return this.open(cb)
  }

  _open (cb) {
    this.corestore.ready(err => {
      if (err) return cb(err)
      this.trie.ready(err => {
        if (err) return cb(err)
        this.key = this.trie.key
        this.discoveryKey = this.trie.discoveryKey
        if (this.feed.writable) this.trie.alwaysUpdate = false
        this.emit('feed', this.feed, {
          version: this.opts && this.opts.version
        })
        this.emit('hypertrie', this.trie)
        return cb(null)
      })
    })
  }

  _close (cb) {
    this.corestore.close(err => {
      this.emit('close')
      return cb(err)
    })
  }

  _createHypertrie (key, opts, cb) {
    const self = this

    const keyString = key.toString('hex')
    var versionedTrie = (opts && opts.version) ? this._checkouts.get(`${keyString}:${opts.version}`) : null
    if (versionedTrie) return process.nextTick(cb, null, versionedTrie)

    try {
      var subfeed = this.corestore.get({ ...opts, key,  version: null })
    } catch (err) {
      err.badKey = true
      return cb(err)
    }

    var trie = this._tries.get(keyString)
    if (opts && opts.cached) return cb(null, trie)
    var creating = !trie

    trie = trie || new MountableHypertrie(this.corestore, key, {
      ...this.opts,
      feed: subfeed,
      sparse: this.sparse
    })
    self._tries.set(keyString, trie)
    if (creating) {
      const onfeed = (feed, opts) => this.emit('feed', feed, opts)
      const ontrie = trie => this.emit('hypertrie', trie)
      self._unlisteners.push(() => trie.removeListener('feed', onfeed))
      self._unlisteners.push(() => trie.removeListener('hypertrie', ontrie))
      trie.on('feed', onfeed)
      trie.on('hypertrie', ontrie)
    }

    if (!trie.opened) {
      trie.ready(err => {
        if (err) return cb(err)
        return onready()
      })
    } else process.nextTick(onready)

    function onready () {
      if (!opts || !opts.version) return ontrie(trie)
      versionedTrie = trie.checkout(opts.version)
      self._checkouts.set(`${keyString}:${opts.version}`, versionedTrie)
      return ontrie(versionedTrie)
    }

    function ontrie (trie) {
      trie.trie.ready(err => {
        if (err) return cb(err)
        return cb(null, trie)
      })
    }
  }

  _trieForMountNode (mountNode, opts, cb) {
    if (typeof opts === 'function') return this._trieForMountNode(mountNode, {}, opts)
    opts = opts || {}

    if (!mountNode) return cb(new Error(`Mount metadata not found`))
    try {
      var mountInfo = Mount.decode(mountNode.value)
    } catch (err) {
      return cb(err)
    }

    this._createHypertrie(mountInfo.key, { ...opts, version: mountInfo.version }, (err, trie) => {
      if (err) return cb(err)
      return cb(null, trie, mountInfo)
    })
  }

  _isNormalNode (node) {
    if (!node) return true
    return node.flags ^ Flags.MOUNT
  }

  _mountInfo () {
    return {
      key: this.key,
      version: this.opts.version ? this.opts.version : null,
      localPath: '',
      remotePath: ''
    }
  }

  _maybeSetSymbols (node, trie, mountInfo, innerPath) {
    if (trie && !node[MountableHypertrie.Symbols.TRIE]) node[MountableHypertrie.Symbols.TRIE] = trie
    if (mountInfo && !node[MountableHypertrie.Symbols.MOUNT]) node[MountableHypertrie.Symbols.MOUNT] = mountInfo
    if (mountInfo && !node[MountableHypertrie.Symbols.INNER_PATH]) node[MountableHypertrie.Symbols.INNER_PATH] = innerPath
  }

  _getSymbols (node) {
    return {
      trie: node[MountableHypertrie.Symbols.TRIE],
      mount: node[MountableHypertrie.Symbols.MOUNT],
      innerPath: node[MountableHypertrie.Symbols.INNER_PATH]
    }
  }

  _getSubtrie (path, cb) {
    this.trie.get(p.join(MOUNT_PREFIX, path), { hidden: true, closest: true }, (err, mountNode) => {
      if (err) return cb(err)
      const mountPath = mountNode && mountNode.key.slice(7)
      if (this._isNormalNode(mountNode) || p.relative(mountPath, path).startsWith('..')) {
        return cb(null, this.trie, this._mountInfo())
      }
      return this._trieForMountNode(mountNode, cb)
    })
  }

  get version () {
    return this.trie.version
  }

  static getMetadata (feed, cb) {
    return hypertrie.getMetadata(feed, cb)
  }

  getMetadata (cb) {
    return this.trie.getMetadata(cb)
  }

  setMetadata (metadata, cb) {
    return this.trie.setMetadata(metadata, cb)
  }

  getFeed () {
    if (!this.trie) return null
    return this.trie.feed
  }

  mount (path, key, opts, cb) {
    if (typeof opts === 'function') return this.mount(path, key, null, opts)
    path = normalize(path)

    if (key.length !== 32 && (!opts || !opts.skipValidation)) {
      const err = new Error('The mount key is not valid.')
      err.badKey = true
      return cb(err)
    }

    const mountRecord = Mount.encode({
      key,
      localPath: path,
      remotePath: opts && opts.remotePath && normalize(opts.remotePath),
      version: opts && opts.version
    })

    this._getSubtrie(path, (err, trie, mountInfo) => {
      if (err) return cb(err)
      const innerPath = pathToMount(path, mountInfo)
      if (!mountInfo.localPath) {
        return trie.batch([
          { type: 'put', key: p.join(MOUNT_PREFIX, innerPath), flags: Flags.MOUNT, hidden: true, value: mountRecord },
          // TODO: empty values going to cause harm here?
          { type: 'put', key: innerPath, flags: Flags.MOUNT, value: (opts && opts.value) || Buffer.alloc(0) }
        ], err => {
          if (err) return cb(err)
          return this._getSubtrie(path, cb)
        })
      }
      return trie.mount(innerPath, key, opts, err => {
        if (err) return cb(err)
        return this._getSubtrie(innerPath, cb)
      })
    })
  }

  unmount (path, cb) {
    path = normalize(path)

    return this._getSubtrie(p.dirname(path), (err, trie, mountInfo) => {
      if (err) return cb(err)
      const innerPath = pathToMount(path, mountInfo)
      trie.get(innerPath, (err, node) => {
        // If the subtrie is a MountableHypertrie, use the internal hypertrie for the batch.
        if (trie.trie) trie = trie.trie
        return trie.batch([
          { type: 'del', key: p.join(MOUNT_PREFIX, innerPath), hidden: true },
          { type: 'del', key: innerPath }
        ], cb)
      })
    })
  }

  loadMount (path, cb) {
    return this._getSubtrie(path, cb)
  }

  get (path, opts, cb) {
    if (typeof opts === 'function') return this.get(path, null, opts)
    path = normalize(path)

    const self = this

    this.trie.get(path, { ...opts, closest: true }, (err, node) => {
      if (err) return cb(err)
      const mountInfo = this._mountInfo()
      if (!node) return cb(null, null, this, mountInfo, path)
      if (this._isNormalNode(node)) {
        this._maybeSetSymbols(node, this, mountInfo, path)
        if (node.key !== path && !(opts && opts.closest)) return cb(null, null, this, mountInfo, path)
        return cb(null, node, this, mountInfo, path)
      }
      if (node.key === path) return cb(null, node, this, mountInfo, path)
      return this._getSubtrie(path, getFromMount)
    })

    function getFromMount (err, trie, mountInfo) {
      if (err) return cb(err)
      const mountPath = pathToMount(path, mountInfo)
      return trie.get(mountPath, opts, (err, node, subTrie, subMountInfo, subMountPath) => {
        if (err) return cb(err)
        subTrie = subTrie || self
        subMountInfo = subMountInfo || mountInfo
        subMountPath = subMountPath || mountPath

        if (!node) return cb(null, null, subTrie, subMountInfo, subMountPath)

        node.key = pathFromMount(node.key, mountInfo)
        if (node.key !== path) return cb(null, null, subTrie, subMountInfo, subMountPath)

        self._maybeSetSymbols(node, subTrie, subMountInfo, subMountPath)
        const { trie: innerTrie, mount: innerMount, innerPath } = self._getSymbols(node)

        return cb(null, node, innerTrie, innerMount, innerPath)
      })
    }
  }

  put (path, value, opts, cb) {
    if (typeof opts === 'function') return this.put(path, value, null, opts)
    path = normalize(path)

    const condition = putCondition(path, opts)

    this.trie.put(path, value, { ...opts, condition, closest: true }, (err, inserted) => {
      if (err && !err.mountpoint) return cb(err)
      else if (err) {
        return this._getSubtrie(path, putIntoMount)
      }
      return cb(null, inserted)
    })

    function putIntoMount (err, trie, mountInfo) {
      if (err) return cb(err)
      const mountPath = pathToMount(path, mountInfo)
      return trie.put(mountPath, value, opts, (err, node) => {
        if (err) return cb(err)
        if (!node) return cb(null, null)
        // TODO: do we need to copy the node here?
        node.key = pathFromMount(node.key, mountInfo)
        return cb(null, node)
      })
    }
  }

  // TODO: remove duplicate code
  del (path, opts, cb) {
    if (typeof opts === 'function') return this.del(path, null, opts)
    path = normalize(path)

    const condition = delCondition(path, opts && opts.condition)

    this.trie.del(path, { ...opts, condition, closest: true }, (err, deleted) => {
      if (err && !err.mountpoint) return cb(err)
      else if (err) {
        return this._getSubtrie(path, delFromMount)
      }
      return cb(null, deleted)
    })

    function delFromMount (err, trie, mountInfo) {
      if (err) return cb(err)
      const mountPath = pathToMount(path, mountInfo)
      return trie.del(mountPath, opts, (err, node) => {
        if (err) return cb(err)
        if (!node) return cb(null, null)
        // TODO: do we need to copy the node here?
        node.key = pathFromMount(node.key, mountInfo)
        return cb(null, node)
      })
    }
  }

  iterator (prefix, opts) {
    if (isOptions(prefix)) return this.iterator('', prefix)
    if (!prefix) prefix = '/'
    prefix = normalize(prefix)
    const self = this

    const recursive = !!(opts && opts.recursive)
    const noMounts = !!(opts && opts.noMounts)
    const gt = !!(opts && opts.gt)
    // gt must always be false in the trie iteration in order to discover mountpoints.
    if (gt) opts = { ...opts, gt: false }

    // Set in open.
    let root = null
    let rootInfo = null

    // If the iterator is currently iterating through a sub-trie, then these will be non-null.
    let subTrie = null
    let sub = null
    let subInfo = null

    return nanoiterator({ next, open })

    function open (cb) {
      self._getSubtrie(prefix, (err, trie, mountInfo) => {
        if (err) return cb(err)
        const subPrefix = pathToMount(prefix, mountInfo)
        root = trie.iterator(subPrefix, opts)
        rootInfo = mountInfo
        return cb(null)
      })
    }

    function next (cb) {
      if (sub) {
        return sub.next((err, node) => {
          if (err) return cb(err)
          if (!node) {
            sub = subInfo = subTrie = null
            return next(cb)
          }

          const innerPath = node.key
          node.key = pathFromMount(node.key, subInfo)
          self._maybeSetSymbols(node, subTrie, subInfo, innerPath)

          return prereturn(node, cb)
        })
      }
      root.next((err, node) => {
        if (err) return cb(err)
        if (!node) return cb(null, null)

        self._maybeSetSymbols(node, self, rootInfo, node.key)

        if (self._isNormalNode(node) || noMounts) return prereturn(node, cb)
        else if (!recursive && node.key !== prefix) return prereturn(node, cb)

        self._getSubtrie(node.key, (err, trie, mountInfo) => {
          if (err) return cb(err)
          const subPrefix = pathToMount(node.key, mountInfo)
          sub = trie.iterator(subPrefix, opts)
          subInfo = mountInfo
          subTrie = trie
          return prereturn(node, cb)
        })
      })
    }

    function prereturn (node, cb) {
      if (gt && node.key === prefix) return next(cb)
      node.key = pathFromMount(node.key, rootInfo)
      return cb(null, node)
    }
  }

  list (prefix, opts, cb) {
    // Code duplicated from hypertrie.
    if (typeof prefix === 'function') return this.list('', null, prefix)
    if (typeof opts === 'function') return this.list(prefix, null, opts)

    const ite = this.iterator(prefix, opts)
    const res = []

    ite.next(function loop (err, node) {
      if (err) return cb(err)
      if (!node) return cb(null, res)
      res.push(node)
      ite.next(loop)
    })
  }

  mountIterator (opts) {
    const memory = !!(opts && opts.memory)
    const recursive = !!(opts && opts.recursive)

    const ite = this.trie.iterator(MOUNT_PREFIX, { hidden: true })
    const stack = [{ trie: this, ite, prefix: '/' }]

    return nanoiterator({ next })

    function next (cb) {
      const { trie, ite, prefix } = stack[0]
      return ite.next((err, mountNode) => {
        if (err) return cb(err)

        if (!mountNode && stack.length === 1) return cb(null, null)
        if (!mountNode) {
          stack.shift()
          return next(cb)
        }

        trie._trieForMountNode(mountNode, { cached: memory }, (err, subTrie, mountInfo) => {
          if (err) return cb(err)
          if (!subTrie) return next(cb)

          const mountPath = p.join(prefix, mountInfo.localPath)
          if (recursive) {
            stack.unshift({
              prefix: p.join(mountPath, mountInfo.remotePath),
              ite: subTrie.iterator(MOUNT_PREFIX, { hidden: true }),
              trie: subTrie
            })
          }

          return cb(null, {
            path: mountPath,
            trie: subTrie
          })
        })
      })
    }
  }

  listMounts (opts, cb) {
    if (typeof opts === 'function') return this.listMounts(null, opts)
    const vals = []
    const ite = this.mountIterator(opts)
    ite.next(function onnext (err, val) {
      if (err) return cb(err)
      if (!val) return cb(null, vals)
      vals.push(val)
      return ite.next(onnext)
    })
  }

  createReadStream (prefix, opts) {
    return toStream(this.iterator(prefix, opts))
  }

  batch (ops, cb) {
    // TODO: implement
  }

  checkout (version) {
    return new MountableHypertrie(this.corestore, null, {
      ...this.opts,
      trie: this.trie,
      feed: this.feed,
      version: version || 1
    })
  }

  history (opts) {
    const self = this
    const ite =  this.trie.history(opts)

    return nanoiterator({ next })

    function next (cb) {
      ite.next((err, node) => {
        if (err) return cb(err)
        if (!node) return cb(null, null)
        if (self._isNormalNode(node)) return cb(null, { type: 'put', node })
        return self._getSubtrie(node.key, (err, trie, mountInfo) => {
          if (err) return cb(err)
          return cb(null, { type: 'mount', info: mountInfo })
        })
      })
    }
  }

  diff (other, prefix, opts)  {
    if (typeof other === 'string') return this.diff(null, other, prefix)
    const checkout = (typeof other === 'number' || !other) ? this.checkout(other) : other
    if (!prefix) prefix = '/'

    const self = this
    var ite = null

    return nanoiterator({ next, open })

    function next (cb) {
      var remaining = 2

      ite.next((err, keyDiff) => {
        if (err) return cb(err)
        if (!keyDiff) return cb(null, null)
        const { left: rawLeft, right: rawRight, key } = keyDiff
        return updateIfMount(rawLeft, (err, left) => {
          if (err) return cb(err)
          return updateIfMount(rawRight, (err, right) => {
            if (err) return cb(err)
            return cb(null, createDiff(left, right, key))
          })
        })
      })
    }

    function open (cb) {
      self._getSubtrie(prefix, (err, trie, mountInfo) => {
        if (err) return cb(err)
        const subPrefix = pathToMount(prefix, mountInfo)
        ite = trie.diff(checkout.trie, pathToMount(prefix, mountInfo), opts)
        return cb(null)
      })
    }

    function updateIfMount (node, cb) {
      if (!node) return process.nextTick(cb, null)
      if (self._isNormalNode(node)) return process.nextTick(cb, null, node)
      if (opts && opts.noMounts) return process.nextTick(cb, null, { info: {} })
      return self._getSubtrie(node.key, (err, trie, mountInfo) => {
        if (err) return cb(err)
        return cb(null, { info: mountInfo })
      })
    }

    function createDiff (left, right, key) {
      const diff = { left, right, key }
      if (!left && right) {
        diff.type = !!right.info ? 'unmount' : 'del'
      } else {
        diff.type = !!left.info ? 'mount' : 'put'
      }
      return diff
    }
  }

  createHistoryStream (opts) {
    return toStream(this.history(opts))
  }

  createDiffStream (other, prefix, opts) {
    return toStream(this.diff(other, prefix, opts))
  }

  watch (path, opts, onchange) {
    if (typeof opts === 'function') return this.watch(path, null, opts)
    const self = this
    var destroyed = false

    var rootWatcher = this.trie.watch(path, onchange)
    var watcherKeys = (opts && opts._watcherKeys) || new Set()
    var watchers = []

    const destroy = rootWatcher.destroy.bind(rootWatcher)
    rootWatcher.watchers = watchers
    rootWatcher.destroy = function () {
      if (destroyed) return
      destroyed = true
      destroy()
      for (let watcher of watchers) {
        watcher.destroy()
      }
    }

    createSubWatchers(err => {
      if (err) rootWatcher.emit('error', err)
      rootWatcher.emit('ready', watchers)
    })

    return rootWatcher

    function createSubWatchers (cb) {
      self.trie.list(p.join(MOUNT_PREFIX, path), { hidden: true }, (err, mountNodes) => {
        if (err || destroyed) return cb(err)
        if (!mountNodes || !mountNodes.length) return cb(null)
        var readyWatchers = 0
        for (let mountNode of mountNodes) {
          if (destroyed) return cb(null)
          self._trieForMountNode(mountNode, (err, trie, mountInfo) => {
            if (err || destroyed) return cb(err)

            const watcherKey = mountInfo.key.toString('hex')
            if (watcherKeys.has(watcherKey)) return subWatcherReady()
            watcherKeys.add(watcherKey)

            const subWatcher = trie.watch(pathToMount(path, mountInfo), { _watcherKeys: watcherKeys }, () => {
              onchange()
            })
            watchers.push(subWatcher)
            if (trie.trie) {
              subWatcher.once('ready', subsubWatchers => {
                watchers.push.apply(watchers, subsubWatchers)
                return subWatcherReady()
              })
            } else {
              return subWatcherReady()
            }
          })
        }

        function subWatcherReady () {
          if (++readyWatchers === mountNodes.length) return cb(null)
        }
      })
    }
  }

  replicate (isInitiator, opts) {
    const stream = new HypercoreProtocol(isInitiator, { ...opts })
    this.ready(err => {
      if (err) return stream.destroy(err)
      this.corestore.replicate(isInitiator, { ...opts, stream })
    })
    return stream
  }
}

MountableHypertrie.Symbols = MountableHypertrie.prototype.Symbols = {
  TRIE: Symbol('trie'),
  MOUNT: Symbol('mount'),
  INNER_PATH: Symbol('inner-path')
}

module.exports = MountableHypertrie

function putCondition (path, opts) {
  const userCondition = opts && opts.condition
  const userClosest = opts && opts.closest
  return (closest, newNode, cb) => {
    const isWithinMount = closest && (newNode.key.startsWith(closest.key) && newNode.key !== closest.key)
    if (closest && (closest.flags & Flags.MOUNT) && isWithinMount) {
      const err = new Error('Operating on a mountpoint')
      err.mountpoint = true
      return cb(err)
    }
    if (!userCondition) return cb(null, true)
    if (closest && closest.key !== newNode.key && !userClosest) closest = null
    userCondition(closest, newNode, (err, shouldExecute) => {
      if (err) return cb(err)
      return cb(null, shouldExecute)
    })
  }
}

function delCondition (path, userCondition) {
  return (closest, cb) => {
    if (closest && (closest.flags & Flags.MOUNT) && (closest.key !== path)) {
      const err = new Error('Operating on a mountpoint')
      err.mountpoint = true
      return cb(err)
    }
    if (!userCondition) return cb(null, true)
    userCondition(closest, (err, shouldExecute) => {
      if (err) return cb(err)
      return cb(null, shouldExecute)
    })
  }
}

function pathToMount (path, mountInfo) {
  if (path.length === mountInfo.localPath.length) return ''
  return p.join(path.slice(mountInfo.localPath.length), mountInfo.remotePath)
}

function pathFromMount (path, mountInfo) {
  const rel = mountInfo.remotePath ? path.slice(mountInfo.remotePath.length) : path
  return p.join(mountInfo.localPath, rel)
}

function normalize (path) {
  path = unixify(path)
  return path.startsWith('/') ? path.slice(1) : path
}
