/**
 * inertia hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

 module.exports = function defineInertiaHook(sails) {
	return {
		defaults: {
			inertia: {
				version: 1,
			}
		},
		/**
		 * Runs when this Sails app loads/lifts.
		 */
		initialize: async function(cb) {
			sails.log.info('Initializing custom hook (`inertia`)');
			sails.inertia = {
		    render: this.render
			}
			return cb()
		},
		routes: {
      before: {
        'GET /*': function(req, res, next) {
            if (!req.get('X-Inertia')) return next()
            let _headers = {};
            let _viewData = {};
            let _statusCode = 200;
            let _sharedProps = {};

            const inertia = {

                setHeaders: function(headers) {
                    _headers = { ..._headers, ...headers }
                    return this
                },

                setViewData: function(viewData) {
                    _viewData = { ..._viewData, viewData };
                    return this;
                },

                setStatusCode: function(statusCode) {
                    _statusCode = statusCode;
                    return this;
                },

                shareProps: function(sharedProps) {
                    _sharedProps = { ..._sharedProps, ...sharedProps };
                    return this;
                },

                render: async function(component, props = {}) {
                  const page = {
                    version: sails.config.inertia.version,
                    component,
                    props,
                    url: req.originalUrl || req.url
                  }
                  const allProps = { ..._sharedProps, ...props };
                  let dataKeys;

                  if (req.get('X-Inertia-Partial-Data') && req.get('X-Inertia-Partial-Component') === component) {
                      dataKeys = req.get('X-Inertia-Partial-Data').split(",")
                  } else {
                      dataKeys = Object.keys(allProps)
                  }
                  for (let key of dataKeys) {
                    if (typeof allProps[key] === "function") {
                      page.props[key] = await allProps[key]()
                    } else {
                      page.props[key] = allProps[key]
                    }
                  }

                  if (req.get('X-Inertia')) {
                    res.writeHead(_statusCode, {
                      ..._headers,
                      'Content-Type': 'application/json',
                      'X-Inertia': 'true',
                      Vary: 'Accept'
                  }).end(JSON.stringify(page))
                  } else {
                    const encodedPageString = JSON.stringify(page)
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");

                    res
                    .writeHead(_statusCode, {
                    ..._headers,
                    "Content-Type": "text/html",
                    })
                    .end(html(encodedPageString, _viewData));
                }
              }
            }
            sails.inertia = inertia
            next()
          }
				}
		},
	};
};
