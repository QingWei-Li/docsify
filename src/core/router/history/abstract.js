import {History} from './base'
import {parseQuery} from '../util'

export class AbstractHistory extends History {
  constructor(config) {
    super(config)
    this.mode = 'abstract'
  }

  parse(path = '') {
    let query = ''

    const queryIndex = path.indexOf('?')
    if (queryIndex >= 0) {
      query = path.slice(queryIndex + 1)
      path = path.slice(0, queryIndex)
    }

    return {
      path,
      file: this.getFile(path),
      query: parseQuery(query)
    }
  }
}
