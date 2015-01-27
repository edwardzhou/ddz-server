class AppPackage
  include Mongoid::Document

  field :appPackageId, type: String
  field :appPackageName, type: String
  field :description, type: String
  field :enabled, type: Boolean, default: true
  field :baseUrl, type: String
  field :updateUrl, type: String
  field :versionUrl, type: String
  field :manifestUrl, type: String
  field :storagePath, type: String
  field :engineVersion, type: String

  include Mongoid::Timestamps

  has_many :app_update_infos

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

end