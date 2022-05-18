/**
 * inertia hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

const { encode } = require('querystring')
const isInertiaRequest = require('./private/is-inertia-request')
const {
  INERTIA,
  PARTIAL_DATA,
  PARTIAL_COMPONENT,
} = require('./private/inertia-headers')
const getPartialData = require('./private/get-partial-data')

module.exports = function defineInertiaHook(sails) {
  var hook
  const sharedProps = {}
  const sharedViewData = {}
  let version = 1
  let rootView = 'app'
  return {
    share(key, value = null) {
      sharedProps[key] = value
    },
    getShared(key = null) {
      return sharedProps[key] ?? sharedProps
    },
    viewData(key, value) {
      sharedViewData[key] = value
    },
    getViewData(key) {
      return sharedViewData[key] ?? sharedViewData
    },
    version(newVersion) {
      version = newVersion
    },
    setRootView(newRootView) {
      rootView = newRootView
    },
    getRootView() {
      return rootView
    },

    initialize: async function (cb) {
      hook = this
      return cb()
    },

    routes: {
      before: {
        'GET /*': {
          skipAssets: true,
          fn: function (req, res, next) {
            hook.render = async function (
              component,
              props = {},
              viewData = {}
            ) {
              const allProps = {
                ...sharedProps,
                ...props,
              }

              const allViewData = {
                ...sharedViewData,
                ...viewData,
              }

              const url = req.url || req.originalUrl
              const currentVersion = version

              const page = {
                component,
                version: currentVersion,
                props: allProps,
                url,
              }

              // Implements inertia partial reload. See https://inertiajs.com/partial-reload
              if (
                req.get(PARTIAL_DATA) &&
                req.get(PARTIAL_COMPONENT) === component
              ) {
                const only = req.get(PARTIAL_DATA).split(',')
                page.props = only.length
                  ? getPartialData(props, only)
                  : page.props
              }

              const queryParams = req.query
              if (req.method == 'GET' && Object.keys(queryParams).length) {
                // Keep original request query params
                url += `?${encode(queryParams)}`
              }

              // Implements inertia requests
              if (isInertiaRequest(req)) {
                return res.status(200).json(page)
              }

              // Implements full page reload
              return sails.hooks.views.render(rootView, {
                page,
                viewData: allViewData,
              })
            }

            // Set Inertia headers
            if (isInertiaRequest(req)) {
              res.set(INERTIA, true)
              res.set('Vary', 'Accept')
            }
            return next()
          },
        },
      },
    },
  }
}
