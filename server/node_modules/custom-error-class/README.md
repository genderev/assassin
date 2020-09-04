# custom-error-class

Straightforward ES6 class you can extend to make custom errors that are all `instanceof` Error with proper stacks.

```
npm install custom-error-class
```

## Usage

``` js
const CustomError = require('custom-error-class')

class MyError extends CustomError {
  constructor () {
    super('an error happened')
    this.code = 'SOME_CODE'
  }
}

// Use this error as you normally would.
throw new MyError()
```

Credits to [@pfrazee](https://github.com/pfrazee) who wrote most of it.

## License

MIT
