# Tendermint Dependency Explorer

This is an experiment in exploring `js-tendermint`'s dependency graph for potential security conerns.
This project assumes the build is done with `sesify` which sandboxes dependencies and reduces their ability to compromise the rest of the app. Sesify uses `SES` containers to limit the capabilities of third party code to explicitly allowed APIs.

This graph shows colors indicating "danger levels" of the platform APIs exposed to each package or module. This visualization can help highlight packages that require excessive permissions and help prioritize audits of dependencies.

See it here: https://kumavis.github.io/tendermint-deps-explorer 
