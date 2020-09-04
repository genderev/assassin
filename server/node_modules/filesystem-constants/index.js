const linux = {
  UV_FS_SYMLINK_DIR: 1,
  UV_FS_SYMLINK_JUNCTION: 2,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_ACCMODE: 3,
  S_IFMT: 61440,
  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFCHR: 8192,
  S_IFBLK: 24576,
  S_IFIFO: 4096,
  S_IFLNK: 40960,
  S_IFSOCK: 49152,
  O_CREAT: 64,
  O_EXCL: 128,
  O_NOCTTY: 256,
  O_TRUNC: 512,
  O_APPEND: 1024,
  O_DIRECTORY: 65536,
  O_NOATIME: 262144,
  O_NOFOLLOW: 131072,
  O_SYNC: 1052672,
  O_DSYNC: 4096,
  O_DIRECT: 16384,
  O_NONBLOCK: 2048,
  S_IRWXU: 448,
  S_IRUSR: 256,
  S_IWUSR: 128,
  S_IXUSR: 64,
  S_IRWXG: 56,
  S_IRGRP: 32,
  S_IWGRP: 16,
  S_IXGRP: 8,
  S_IRWXO: 7,
  S_IROTH: 4,
  S_IWOTH: 2,
  S_IXOTH: 1,
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  UV_FS_COPYFILE_EXCL: 1,
  COPYFILE_EXCL: 1,
  UV_FS_COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE: 2,
  UV_FS_COPYFILE_FICLONE_FORCE: 4,
  COPYFILE_FICLONE_FORCE: 4
}

const darwin = {
  UV_FS_SYMLINK_DIR: 1,
  UV_FS_SYMLINK_JUNCTION: 2,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_ACCMODE: 3,
  UV_DIRENT_UNKNOWN: 0,
  UV_DIRENT_FILE: 1,
  UV_DIRENT_DIR: 2,
  UV_DIRENT_LINK: 3,
  UV_DIRENT_FIFO: 4,
  UV_DIRENT_SOCKET: 5,
  UV_DIRENT_CHAR: 6,
  UV_DIRENT_BLOCK: 7,
  S_IFMT: 61440,
  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFCHR: 8192,
  S_IFBLK: 24576,
  S_IFIFO: 4096,
  S_IFLNK: 40960,
  S_IFSOCK: 49152,
  O_CREAT: 512,
  O_EXCL: 2048,
  O_NOCTTY: 131072,
  O_TRUNC: 1024,
  O_APPEND: 8,
  O_DIRECTORY: 1048576,
  O_NOFOLLOW: 256,
  O_SYNC: 128,
  O_DSYNC: 4194304,
  O_SYMLINK: 2097152,
  O_NONBLOCK: 4,
  S_IRWXU: 448,
  S_IRUSR: 256,
  S_IWUSR: 128,
  S_IXUSR: 64,
  S_IRWXG: 56,
  S_IRGRP: 32,
  S_IWGRP: 16,
  S_IXGRP: 8,
  S_IRWXO: 7,
  S_IROTH: 4,
  S_IWOTH: 2,
  S_IXOTH: 1,
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  UV_FS_COPYFILE_EXCL: 1,
  COPYFILE_EXCL: 1,
  UV_FS_COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE: 2,
  UV_FS_COPYFILE_FICLONE_FORCE: 4,
  COPYFILE_FICLONE_FORCE: 4
}

// Lightly-modified from the Node FS internal utils.
function parse (constants, flags) {
  if (typeof flags === 'number') {
    return flags
  }

  switch (flags) {
    case 'r' : return constants.O_RDONLY
    case 'rs' : // Fall through.
    case 'sr' : return constants.O_RDONLY | constants.O_SYNC
    case 'r+' : return constants.O_RDWR
    case 'rs+' : // Fall through.
    case 'sr+' : return constants.O_RDWR | constants.O_SYNC

    case 'w' : return constants.O_TRUNC | constants.O_CREAT | constants.O_WRONLY
    case 'wx' : // Fall through.
    case 'xw' : return constants.O_TRUNC | constants.O_CREAT | constants.O_WRONLY | constants.O_EXCL

    case 'w+' : return constants.O_TRUNC | constants.O_CREAT | constants.O_RDWR
    case 'wx+': // Fall through.
    case 'xw+': return constants.O_TRUNC | constants.O_CREAT | constants.O_RDWR | constants.O_EXCL

    case 'a' : return constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY
    case 'ax' : // Fall through.
    case 'xa' : return constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY | constants.O_EXCL
    case 'as' : // Fall through.
    case 'sa' : return constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY | constants.O_SYNC

    case 'a+' : return constants.O_APPEND | constants.O_CREAT | constants.O_RDWR
    case 'ax+': // Fall through.
    case 'xa+': return constants.O_APPEND | constants.O_CREAT | constants.O_RDWR | constants.O_EXCL
    case 'as+': // Fall through.
    case 'sa+': return constants.O_APPEND | constants.O_CREAT | constants.O_RDWR | constants.O_SYNC
  }
  throw new Error(`Invalid value in flags: ${flags}`)
}

function translate (from, to, flags) {
  let translated = 0
  translated |= (from.O_RDONLY & flags) && to.O_RDONLY
  translated |= (from.O_WRONLY & flags) && to.O_WRONLY
  translated |= (from.O_RDWR & flags) && to.O_RDWR
  translated |= (from.O_CREAT & flags) && to.O_CREAT
  translated |= (from.O_APPEND & flags) && to.O_APPEND 
  translated |= (from.O_EXCL & flags) && to.O_EXCL 
  translated |= (from.O_TRUNC & flags) && to.O_TRUNC 
  translated |= (from.O_DIRECT & flags) && to.O_DIRECT 
  translated |= (from.O_DSYNC & flags) && to.O_DSYNC 
  translated |= (from.O_DIRECTORY & flags) && to.O_DIRECTORY 
  translated |= (from.O_NOATIME & flags) && to.O_NOATIME 
  translated |= (from.O_NOCTTY & flags) && to.O_NOCTTY 
  translated |= (from.O_NOFOLLOW & flags) && to.O_NOFOLLOW 
  translated |= (from.O_NONBLOCK & flags) && to.O_NONBLOCK 
  return translated
}

module.exports = {
  linux,
  darwin,
  parse,
  translate
}
