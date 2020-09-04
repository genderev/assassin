const p = require('path').posix

const unixify = require('unixify')
const SandboxPath = require('sandbox-path')

const sandbox = new SandboxPath('/')

function resolvePath (path, states) {
  var mountpoint = ''
  for (let i = 0; i < states.length; i++) {
    const mountInfo = states[i].mountInfo
    path = pathFromMount(path, mountInfo)
    mountpoint = mountPath(mountInfo) + mountpoint
  }
  return { path, mountpoint }
}

function pathToMount (path, mountInfo, mountpoint = '/') {
  path = normalize(path)

  console.log('in pathToMount')
  if (!mountInfo.symlink) {
    if (!mountInfo.localPath || (mountInfo.localPath === path)) return path
    console.log('  mountInfo:', mountInfo, 'path:', path, 'relative:', sandbox.relative(mountInfo.localPath, path))
    return p.join(mountInfo.remotePath, sandbox.relative(mountInfo.localPath, path))
  }
  const link = mountInfo.symlink
  const root = link.global ? '' : mountpoint
  const mountpath = mountPath(mountInfo, mountpoint)
  const relativePath = sandbox.relative(mountInfo.localPath, path)

  console.log('root:', root, 'link:', link, 'path:', path, 'mountpath:', mountpath)
  console.log('calling sandbox.resolve, dirname:', p.dirname(mountInfo.localPath), 'target:', mountInfo.remotePath)
  const resolved = p.join(root, mountInfo.remotePath, relativePath)
  console.log('pathToMount resolved:', resolved)
  return (resolved === '.') ? '' : resolved
}

function pathFromMount (path, mountInfo) {
  path = normalize(path)

  console.log('in pathFromMount:', path, 'mountInfo:', mountInfo)
  if (!mountInfo.symlink) {
    const rel = mountInfo.remotePath ? path.slice(mountInfo.remotePath.length) : path
    console.log('mountInfo here:', mountInfo, 'rel:', rel)
    return p.join(mountInfo.localPath, rel)
  }
  const linkPath = mountPath(mountInfo)
  const relativePath = path.slice(linkPath.length)
  const joined = p.join(mountInfo.localPath, relativePath)
  console.log('linkPath:', linkPath, 'relativePath:', relativePath, 'joined:', joined)
  return joined
}

function mountPath (mountInfo, parent) {
  if (!mountInfo.symlink) {
    return mountInfo.remotePath ? p.join(mountInfo.localPath, mountInfo.remotePath) : mountInfo.localPath
  }
  const resolved = sandbox.resolve(mountInfo.localPath, mountInfo.remotePath)
  console.log('mountPath:', resolved)
  return parent ? p.join(parent, resolved) : resolved
}

function normalize (path) {
  path = unixify(path)
  return sandbox.normalize(path)
}

module.exports = {
  normalize,
  mountPath,
  pathToMount,
  pathFromMount,
  resolvePath
}
