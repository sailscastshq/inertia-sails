module.exports = function(props, only = []) {
  return  Object.assign({}, ...only.map(key => ({ [key]: props[key] })))
}
