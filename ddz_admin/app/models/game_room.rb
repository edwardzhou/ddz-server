class GameRoom
  include Mongoid::Document

  field :roomId, type: Integer
  field :roomName, type: String
  field :roomDesc, type: String
  field :roomType, type: String
  field :state, type: Integer
  field :ante, type: Integer
  field :rake, type: Float
  field :maxCoinsQty, type: Integer
  field :minCoinsQty, type: Integer
  field :sortIndex, type: Integer
  field :readyTimeout, type: Integer, default: 10
  field :grabbingLordTimeout, type: Integer, default: 20
  field :playCardTimeout, type: Integer, default: 30
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }


  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end