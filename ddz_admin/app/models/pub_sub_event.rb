class PubSubEvent
  include Mongoid::Document

  field :eventName, type: String
  field :eventData, type: Hash
  field :active, type: Integer, default: 1
  field :createdAt, type: DateTime, default: ->{ Time.now }
  field :updatedAt, type: DateTime, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end