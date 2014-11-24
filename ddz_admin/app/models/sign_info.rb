class SignInfo
  include Mongoid::Document

  field :appid, type: Integer
  field :channelId, type: String
  field :appNumber, type: Integer
  field :appVersion, type: String
  field :resVersion, type: String
  field :signedTime, type: DateTime, default: ->{ Time.now }
  embeds_one :handset, class_name: "DeviceInfo"

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end