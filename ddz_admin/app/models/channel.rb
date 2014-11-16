class Channel
  include Mongoid::Document

  field :channelId, type: Integer
  field :channelName, type: String
  field :description, type: String
  field :enabled, type: Boolean, default: true
  field :createAt, type: DateTime, default: ->{ Time.now }
  field :updateAt, type: DateTime, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end
end