class GameStat
  include Mongoid::Document
  field :won, type: Integer, default: 0
  field :lose, type: Integer, default: 0

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end
end

class DdzUserProfile
  include Mongoid::Document

  field :userId, type: Integer
  field :coins, type: Integer
  field :vipLevel, type: Integer
  field :avatar, type: String

  embeds_one :gameStat, class_name: "GameStat"
  embeds_one :lastSignedIn, class_name: "SignInfo"

  belongs_to :user, class_name: "User"

  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end