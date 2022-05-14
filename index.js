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
        rootView: 'app'
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
        'GET *': function(req, res, next) {
            if (!req.get('X-Inertia')) return next()
            let _statusCode = 200;

            const inertia = {
                async render(component, props = {}) {
                  const page = {
                    version: sails.config.inertia.version,
                    component,
                    props,
                    url: req.originalUrl || req.url
                  }
                  const allProps = { ...props };
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
                    res.set({
                      'Content-Type': 'application/json',
                      'X-Inertia': true,
                      Vary: 'Accept'
                    })
                    res.status = _statusCode
                    res.end(JSON.stringify(page))
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
