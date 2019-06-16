const React = require('react')
const ObservableStore = require('obs-store')
const { GraphContainer, ForceGraph, util: { createNode, createLink } } = require('react-force-directed')
const configData = require('../data/config.json')

class DepGraph extends React.Component {

  constructor () {
    super()
    // prepare empty graph
    this.graph = { nodes: [], links: [], container: { width: 0, height: 0 } }
    // contain graph in observable store
    this.graphStore = new ObservableStore(this.graph)
  }

  componentDidMount () {
    // generate graph
    const { bundleData, mode } = this.props
    this.updateGraph(bundleData, mode)
  }

  componentWillReceiveProps (nextProps) {
    // recalculate graph if `mode` or `bundleData` change
    if (this.props.mode !== nextProps.mode || this.props.bundleData !== nextProps.bundleData) {
      const { bundleData, mode } = nextProps
      this.updateGraph(bundleData, mode)
    }
  }

  updateGraph (bundleData, mode) {
    const { nodes, links } = createGraphByMode(bundleData, mode)
    this.graphStore.updateState({ nodes, links })
  }

  onResize (size) {
    this.graphStore.updateState({ container: size })
  }

  render () {
    const actions = {
      selectNode: console.log
    }

    return (
      <div className="fullSize" ref={this.containerRef}>
        <GraphContainer onSize={size => this.onResize(size)}>
          <ForceGraph graphStore={this.graphStore} actions={actions}/>
        </GraphContainer>
        {ForceGraph.createStyle()}
      </div>
    )
  }
}

module.exports = DepGraph

function labelForFileSize (size) {
  const fileSizeOrder = Math.floor((Math.log(size)/Math.log(10))/3)
  const fileSizeUnit = ['b','kb','mb'][fileSizeOrder]
  const fileSizeForUnit = size / Math.pow(10, fileSizeOrder * 3)
  const fileSizeForUnitFormatted = (size > 1000) ? fileSizeForUnit.toFixed(1) : fileSizeForUnit
  const fileSizeLabel = `${fileSizeForUnitFormatted} ${fileSizeUnit}`
  return fileSizeLabel
}

function createGraphByMode (bundleData, mode) {
  // create graph for mode
  if (mode === 'modules') {
    return createModuleGraph(bundleData)
  } else {
    return createPackageGraph(bundleData)
  }
}

function createPackageGraph (bundleData) {
  const packageData = {}
  
  // create a fake `bundleData` using the packages
  Object.keys(bundleData).forEach(parentId => {
    const module = bundleData[parentId]
    const { package: packageName } = module
    let pack = packageData[packageName]
    // if first module in package, initialize with module
    if (!pack) {
      pack = Object.assign({}, module)
      pack.file = `${packageName} files`
      pack.entry = (packageName === '<root>')
      pack.deps = {}
      packageData[packageName] = pack
    } else {
      // package already exists, just need add size (deps added later)
      const { size } = module
      pack.size += size
    }
    // add deps
    Object.values(module.deps).forEach(id => {
      // use `id` so that there are not redundant links. the actual key is not important.
      pack.deps[id] = id
    })
  })

  return createModuleGraph(packageData)
}

function createModuleGraph (bundleData) {
  const nodes = [], links = []

  // for each module, create node and links 
  Object.keys(bundleData).forEach(parentId => {
    const { file, package:packageName, deps, size, entry } = bundleData[parentId]
    // const scale = 1 / 20
    // const radius = scale * Math.sqrt(size)
    const radius = 5
    // const radius = 5
    // const fileSizeLabel = labelForFileSize(size)
    // const label = `${fileSizeLabel} ${packageName}\n${file}`
    const configForPackage = configData.resources[packageName] || {}
    const configLabel = JSON.stringify(configForPackage, null, 2)
    const label = `${packageName}\n${file}\n${configLabel}`
    const isEntryPackage = packageName === '<root>'
    // entry module is orange
    // entry pacakge (app code) is blue
    // deps are green
    // let color = entry ? 'orange' : (isEntryPackage ? 'blue' : 'green')
    const color = isEntryPackage ? 'purple' : getColorForConfig(configForPackage)
    // create node for modules
    nodes.push(
      createNode({ id: parentId, radius, label, color })
    )
    // create links for deps
    Object.keys(deps).forEach(depName => {
      const childId = deps[depName]
      links.push(
        createLink({ source: parentId, target: childId })
      )
    })
  })

  // handle missing nodes (e.g. external deps)
  links.forEach(link => {
    if (!bundleData[link.target]) {
      nodes.push(
        createNode({ id: link.target, radius: 0 })
      )
    }
  })

  return { nodes, links }
}

const redAlertGlobals = [
  'chrome',
  'window',
  'document',
  'document.body',
  'document.body.appendChild',
  'location',
  'XMLHttpRequest',
  'WebSocket',
  'crypto',
]

const orangeAlertGlobals = [
  'localStorage',
  'prompt',
]

function getColorForConfig (packageConfig) {
  // no globals - should be safe
  if (!packageConfig.globals) return 'green'
  const globals = Object.keys(packageConfig.globals)
  if (globals.some(glob => redAlertGlobals.includes(glob))) {
    return 'red'
  }
  if (globals.some(glob => orangeAlertGlobals.includes(glob))) {
    return 'brown'
  }
  // has globals but nothing scary
  return 'orange'
}