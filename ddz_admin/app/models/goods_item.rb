class GoodsItem
  include Mongoid::Document

  field :goodsId, type: BSON::ObjectId
  field :goodsCount, type: Integer
  field :sortIndex, type: Integer

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def goods
    @goods = DdzGoods.find_by_id(self.goodsId) if @goods.nil?
    @goods
  end

end