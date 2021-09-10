import { isFn } from '@designable/shared'
import { DEFAULT_DRIVERS, DEFAULT_EFFECTS, DEFAULT_SHORTCUTS } from './presets'
import { Engine, TreeNode } from './models'
import {
  IEngineProps,
  IResourceCreator,
  IBehaviorCreator,
  IDesignerLocales,
  IResource,
  IBehavior,
  IBehaviorHost,
  IResourceHost,
} from './types'
import { mergeLocales } from './internals'

export const isBehaviorHost = (val: any): val is IBehaviorHost =>
  val?.Behavior && isBehaviorList(val.Behavior)

export const isBehaviorList = (val: any): val is IBehavior[] =>
  Array.isArray(val) && val.every(isBehavior)

export const isBehavior = (val: any): val is IBehavior =>
  isFn(val?.selector) && (!!val?.designerProps || !!val?.designerLocales)

export const isResourceHost = (val: any): val is IResourceHost =>
  val?.Resource && isResourceList(val.Resource)

export const isResourceList = (val: any): val is IResource[] =>
  Array.isArray(val) && val.every(isResource)

export const isResource = (val: any): val is IResource =>
  val?.node && !!val.node.isSourceNode && val.node instanceof TreeNode

export const createLocales = (...packages: IDesignerLocales[]) => {
  const results = {}
  packages.forEach((locales) => {
    mergeLocales(results, locales)
  })
  return results
}

export const createBehavior = (
  ...behaviors: IBehaviorCreator[]
): IBehavior[] => {
  return behaviors.reduce((buf, pattern) => {
    const { selector } = pattern || {}
    if (!selector) return buf
    if (typeof selector === 'string') {
      pattern.selector = (node) => node.componentName === selector
    }
    return buf.concat(pattern)
  }, [])
}

export const createResource = (...sources: IResourceCreator[]): IResource[] => {
  return sources.reduce((buf, source) => {
    return buf.concat({
      ...source,
      node: new TreeNode({
        componentName: '$$ResourceNode$$',
        isSourceNode: true,
        children: source.elements || [],
      }),
    })
  }, [])
}

export const createDesigner = (props: IEngineProps<Engine> = {}) => {
  const drivers = props.drivers || []
  const effects = props.effects || []
  const shortcuts = props.shortcuts || []
  return new Engine({
    ...props,
    effects: [...effects, ...DEFAULT_EFFECTS],
    drivers: [...drivers, ...DEFAULT_DRIVERS],
    shortcuts: [...shortcuts, ...DEFAULT_SHORTCUTS],
  })
}
