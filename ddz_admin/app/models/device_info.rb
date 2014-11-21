class DeviceInfo
  include Mongoid::Document

  field :model, type: String
  field :os_ver, type: String
  field :fingerprint, type: String
  field :brand, type: String
  field :manufacture, type: String
  field :cpuAbi, type: String
  field :device, type: String
  field :product, type: String
  field :display, type: String
  field :buildId, type: String
  field :imsi, type: String
  field :imei, type: String
  field :mac, type: String

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end