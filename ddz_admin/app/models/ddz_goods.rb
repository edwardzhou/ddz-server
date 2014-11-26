class DdzGoods
  include Mongoid::Document

  field :goods, type: Integer
  field :goodsName, type: String
  field :goodsDesc, type: String
  field :goodsType, type: String
  field :sortIndex, type: Integer
  field :goodsProps, type: Hash
  field :createdAt, type: DateTime, default: ->{ Time.now }
  field :updatedAt, type: DateTime, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def goods_props_hash
    self.goodsProps.to_json
  end

  def goods_props_hash=(value)
    self.goodsProps = JSON.parse(value)
  end

  # ActiveSupport::Inflector.inflections do |inflect|
  #   inflect.singular("status", "status")
  # end
end