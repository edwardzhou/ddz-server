class AppServerInfo
  include Mongoid::Document

  field :appPkgName, type: String
  field :appName, type: String
  field :updateVersionUrl, type: String
  field :updateManifestUrl, type: String
  field :gameServers, type: Array
  field :enabled, type: Boolean, default: true
  include Mongoid::Timestamps

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def gameServers_hash
    self.gameServers.to_json
  end

  def gameServers_hash=(value)
    servers = JSON.parse(value)
    servers.each do |server|
      server.delete("_id")
    end
    self.gameServers = servers
  end

end