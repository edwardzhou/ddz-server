class GoodsItem
  include Mongoid::Document

  field :goodsId, type: BSON::ObjectId
  field :goodsCount, type: Integer
  field :sortIndex, type: Integer
end