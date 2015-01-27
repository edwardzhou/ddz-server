require 'zip'


class AppUpdateInfo
  include Mongoid::Document

  field :appVersion, type: String
  field :resVersion, type: String
  field :enabled, type: Boolean, default: true
  field :manifestInfo, type: Hash, default: ->{ {:_placeholder => 0} }
  field :versionInfo, type: Hash, default: ->{ {:_placeholder => 0} }
  field :searchPaths, type: String

  include Mongoid::Timestamps
  belongs_to :app_package

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def zipFile=(file)
    assets = {}
    buffer = file.read
    Zip::File.open(file.tempfile.path) do |entries|
      entries.each do |entry|
        unless entry.name_is_directory? then
          entry.get_input_stream do |fis|
            md5 = ::Digest::MD5.new
            md5.update(fis.read)
            assets[entry.name] = {md5: md5.hexdigest}
          end
        end

      end
    end
    Rails.logger.debug(assets)
    self.manifestInfo = {assets: assets.to_json}
  end
end