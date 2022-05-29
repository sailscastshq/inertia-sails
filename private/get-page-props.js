// Implement lazy data evaluation
// Userland can pass functions that returns a value becuase of this algorithm
// However do note to make all async operations outside the render() method in userland
module.exports = function (allProps, dataKeys = [], cb) {
  let props = {}
  for (const key of dataKeys) {
    if (typeof allProps[key] === 'function') {
      props[key] = allProps[key]()
    } else {
      props[key] = allProps[key]
    }
  }

  return props
}
