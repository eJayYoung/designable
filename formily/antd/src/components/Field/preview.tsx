import React from 'react'
import { FormPath } from '@formily/core'
import {
  ArrayField,
  Field as InternalField,
  ObjectField,
  VoidField,
  observer,
  ISchema,
} from '@formily/react'
import { FormItem } from '@formily/antd'
import { each, reduce } from '@formily/shared'
import { createBehavior } from '@designable/core'
import {
  useDesigner,
  useTreeNode,
  useComponents,
  DnFC,
} from '@designable/react'
import { isArr, isStr } from '@designable/shared'
import { Container } from '../../common/Container'
import { AllLocales } from '../../locales'

const SchemaStateMap = {
  title: 'title',
  description: 'description',
  default: 'value',
  enum: 'dataSource',
  readOnly: 'readOnly',
  writeOnly: 'editable',
  'x-content': 'content',
  'x-value': 'value',
  'x-editable': 'editable',
  'x-disabled': 'disabled',
  'x-read-pretty': 'readPretty',
  'x-read-only': 'readOnly',
  'x-visible': 'visible',
  'x-hidden': 'hidden',
  'x-display': 'display',
  'x-pattern': 'pattern',
}

const NeedShownExpression = {
  title: true,
  description: true,
  default: true,
  'x-content': true,
  'x-value': true,
}

const isExpression = (val: any) => isStr(val) && /^\{\{.*\}\}$/.test(val)

const filterExpression = (val: any) => {
  if (typeof val === 'object') {
    const isArray = isArr(val)
    const results = reduce(
      val,
      (buf: any, value, key) => {
        if (isExpression(value)) {
          return buf
        } else {
          const results = filterExpression(value)
          if (results === undefined || results === null) return buf
          if (isArray) {
            return buf.concat([results])
          }
          buf[key] = results
          return buf
        }
      },
      isArray ? [] : {}
    )
    return results
  }
  if (isExpression(val)) {
    return
  }
  return val
}

const toDesignableFieldProps = (
  schema: ISchema,
  components: any,
  nodeIdAttrName: string,
  id: string
) => {
  const results: any = {}
  each(SchemaStateMap, (fieldKey, schemaKey) => {
    const value = schema[schemaKey]
    if (isExpression(value)) {
      if (!NeedShownExpression[schemaKey]) return
      if (value) {
        results[fieldKey] = value
        return
      }
    } else if (value) {
      results[fieldKey] = filterExpression(value)
    }
  })
  if (!components['FormItem']) {
    components['FormItem'] = FormItem
  }
  const decorator = FormPath.getIn(components, schema['x-decorator'])
  const component = FormPath.getIn(components, schema['x-component'])
  const decoratorProps = schema['x-decorator-props'] || {}
  const componentProps = schema['x-component-props'] || {}
  if (decorator) {
    FormPath.setIn(decoratorProps, nodeIdAttrName, id)
  } else if (component) {
    FormPath.setIn(componentProps, nodeIdAttrName, id)
  }
  results.decorator = [decorator, decoratorProps]
  results.component = [component, componentProps]
  return results
}

export const Field: DnFC<ISchema> = observer((props) => {
  const designer = useDesigner()
  const components = useComponents()
  const node = useTreeNode()
  if (!node) return null
  const fieldProps = toDesignableFieldProps(
    props,
    components,
    designer.props.nodeIdAttrName,
    node.id
  )
  if (props.type === 'object') {
    return (
      <Container>
        <ObjectField {...fieldProps} name={node.id}>
          {props.children}
        </ObjectField>
      </Container>
    )
  } else if (props.type === 'array') {
    return <ArrayField {...fieldProps} name={node.id} />
  } else if (node.props.type === 'void') {
    return (
      <VoidField {...fieldProps} name={node.id}>
        {props.children}
      </VoidField>
    )
  }
  return <InternalField {...fieldProps} name={node.id} />
})

Field.Behavior = createBehavior({
  selector: 'Field',
  designerLocales: AllLocales.Field,
})
