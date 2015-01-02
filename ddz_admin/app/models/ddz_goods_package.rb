class DdzGoodsPackage
  include Mongoid::Document

  field :packageId, type: String
  field :packageName, type: String
  field :packageDesc, type: String
  field :packageType, type: String
  field :packageIcon, type: String
  field :price, type: Integer
  field :enabled, type: Boolean, default: true
  field :sortIndex, type: Integer, default: 255
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

  embeds_many :items, class_name: "GoodsItem"

  accepts_nested_attributes_for :items

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def to_s
    "#{self.packageId} - #{self.packageName}"
  end

  def itemsToGoods()
    self.items.each do |item|
      item.goods = DdzGoods.find_by_id(item.goodsId) unless item.respond_to?(:goods)
    end

    self.items
  end

end