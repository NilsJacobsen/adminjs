import { expect } from 'chai'
import sinon from 'sinon'

import PropertyDecorator from './property-decorator'
import BaseProperty from '../../adapters/property/base-property'
import AdminBro from '../../../admin-bro'
import ResourceDecorator from '../resource/resource-decorator'

describe('PropertyDecorator', function () {
  const translatedProperty = 'translated property'
  let stubbedAdmin: AdminBro
  let property: BaseProperty
  let args: { property: BaseProperty; admin: AdminBro; resource: ResourceDecorator }

  beforeEach(function () {
    property = new BaseProperty({ path: 'name', type: 'string' })
    stubbedAdmin = sinon.createStubInstance(AdminBro)
    stubbedAdmin.translateProperty = sinon.stub().returns(translatedProperty)
    args = { property, admin: stubbedAdmin, resource: { id: () => 'someId' } as ResourceDecorator }
  })

  describe('#isSortable', function () {
    it('passes the execution to the base property', function () {
      sinon.stub(BaseProperty.prototype, 'isSortable').returns(false)
      expect(new PropertyDecorator(args).isSortable()).to.equal(false)
    })
  })

  describe('#isVisible', function () {
    it('passes execution to BaseProperty.isVisible for list when no options are specified', function () {
      expect(new PropertyDecorator(args).isVisible('list')).to.equal(property.isVisible())
    })

    it('passes execution to BaseProperty.isEditable for edit when no options are specified', function () {
      sinon.stub(BaseProperty.prototype, 'isVisible').returns(false)
      expect(new PropertyDecorator(args).isVisible('edit')).to.equal(property.isEditable())
    })

    it('sets new value when it is changed for all views by isVisible option', function () {
      const decorator = new PropertyDecorator({ ...args, options: { isVisible: false } })
      expect(decorator.isVisible('list')).to.equal(false)
      expect(decorator.isVisible('edit')).to.equal(false)
      expect(decorator.isVisible('show')).to.equal(false)
    })
  })

  describe('#label', function () {
    it('returns translated label', function () {
      sinon.stub(BaseProperty.prototype, 'name').returns('normalName')
      expect(new PropertyDecorator(args).label()).to.equal(translatedProperty)
    })
  })

  describe('#availableValues', function () {
    it('map default value to { value, label } object and uses translations', function () {
      sinon.stub(BaseProperty.prototype, 'availableValues').returns(['val'])
      expect(new PropertyDecorator(args).availableValues()).to.deep.equal([{
        value: 'val',
        label: translatedProperty,
      }])
    })
  })

  describe('#position', function () {
    it('returns -1 for title field', function () {
      sinon.stub(BaseProperty.prototype, 'isTitle').returns(true)
      expect(new PropertyDecorator(args).position()).to.equal(-1)
    })

    it('returns 101 for second field', function () {
      sinon.stub(BaseProperty.prototype, 'isTitle').returns(false)
      expect(new PropertyDecorator(args).position()).to.equal(101)
    })

    it('returns 0 for an id field', function () {
      sinon.stub(BaseProperty.prototype, 'isTitle').returns(false)
      sinon.stub(BaseProperty.prototype, 'isId').returns(true)
      expect(new PropertyDecorator(args).position()).to.equal(0)
    })
  })

  describe('#subProperties', function () {
    let propertyDecorator: PropertyDecorator
    const propertyName = 'super'
    const subPropertyName = 'nested'
    const subPropertyLabel = 'nestedLabel'

    beforeEach(function () {
      property = new BaseProperty({ path: propertyName, type: 'string' })
      sinon.stub(property, 'subProperties').returns([
        new BaseProperty({ path: subPropertyName, type: 'string' }),
      ])

      propertyDecorator = new PropertyDecorator({
        ...args,
        property,
        resource: {
          id: () => 'resourceId',
          options: { properties: {
            [`${propertyName}.${subPropertyName}`]: { label: subPropertyLabel },
          } } } as unknown as ResourceDecorator,
      })
    })

    it('returns the array of decorated properties', function () {
      expect(propertyDecorator.subProperties()).to.have.lengthOf(1)
      expect(propertyDecorator.subProperties()[0]).to.be.instanceOf(PropertyDecorator)
    })

    it('changes label of the nested property to what was given in PropertyOptions', function () {
      const subProperty = propertyDecorator.subProperties()[0]

      expect(subProperty.label()).to.eq(translatedProperty)
    })
  })

  describe('#toJSON', function () {
    it('returns JSON representation of a property', function () {
      expect(new PropertyDecorator(args).toJSON()).to.have.keys(
        'isTitle',
        'isId',
        'position',
        'isSortable',
        'availableValues',
        'name',
        'label',
        'type',
        'reference',
        'components',
        'isDisabled',
        'subProperties',
        'isArray',
        'custom',
        'resourceId',
        'path',
        'isRequired',
      )
    })
  })

  afterEach(function () {
    sinon.restore()
  })
})
