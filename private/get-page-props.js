// Implement lazy data evaluation
module.exports = function (allProps, dataKeys = []) {
  let props = {}
  for (const key of dataKeys) {
    if (typeof props[key] === 'function') {
      props[key] = allProps[key]()
    } else {
      props[key] = allProps[key]
    }
  }
  return props
}
