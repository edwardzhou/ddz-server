class DdzGoods
  include Mongoid::Document

  field :goodsId, type: String
  field :goodsName, type: String
  field :goodsDesc, type: String
  field :goodsType, type: String
  field :goodsAction, type: String
  field :goodsIcon, type: String
  field :sortIndex, type: Integer
  field :goodsProps, type: Hash, default: ->{ {:_placeholder => 0} }
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

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