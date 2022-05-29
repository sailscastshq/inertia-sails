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
const getPageProps = require('./private/get-page-props')

module.exports = function defineInertiaHook(sails) {
  let hook
  let sharedProps = {}
  let sharedViewData = {}
  let rootView = 'app'
  let version
  return {
    share: (key, value = null) => (sharedProps[key] = value),

    getShared: (key = null) => sharedProps[key] ?? sharedProps,

    flushShared: () => (sharedProps = {}),

    viewData: (key, value) => (sharedViewData[key] = value),

    getViewData: (key) => sharedViewData[key] ?? sharedViewData,

    setRootView: (newRootView) => (rootView = newRootView),

    getRootView: () => rootView,

    version: (newVersion) => (version = newVersion),

    getVersion: () => version,

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

              let url = req.url || req.originalUrl
              const currentVersion = version

              const page = {
                component,
                version: currentVersion,
                props: {},
                url,
              }

              // Implements inertia partial reload. See https://inertiajs.com/partial-reload
              let dataKeys
              if (
                req.get(PARTIAL_DATA) &&
                req.get(PARTIAL_COMPONENT) === component
              ) {
                dataKeys = req.get(PARTIAL_DATA).split(',')
              } else {
                dataKeys = Object.keys(allProps)
              }

              page.props = getPageProps(allProps, dataKeys)

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
            hook.location = function (url = req.headers['referer']) {
              const statusCode = ['PUT', 'PATCH', 'DELETE'].includes(req.method)
                ? 303
                : 409
              res.status(statusCode)
              res.set('X-Inertia-Location', url)
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
