# filesystem-constants
Inlined FS constants without the dependency on Node's FS module.

Also provides a few utility functions for converting `fs.open` flags between OSX and Linux, and for converting between string and integer representations.

## Installation
`npm i filesystem-constants --save`

## Usage
### `constants.linux`
FS constants on Linux, copied from `fs.constants`.

### `constants.darwin`
FS constants on OSX, copied from `fs.constants`.

### `constants.parse`
Converts flags from their string representation (i.e. 'r') to a flags integer.

```js
const { linux, parse } = require('filesystem-constants')
const flags = parse(linux, 'w+') // 578
```

### `constants.translate(from, to, flags)`
Translates flags between two platform-specific representations.

```js
const { linux, darwin, translate } = require('filesystem-constants')
translate(darwin, linux, darwin.O_CREATE | darwin.O_APPEND) // 1088 (linux.O_CREATE | linux.O_APPEND)
```

## License
MIT
