class PubSubEvent
  include Mongoid::Document

  field :eventName, type: String
  field :eventData, type: Hash
  field :active, type: Integer, default: 1
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end