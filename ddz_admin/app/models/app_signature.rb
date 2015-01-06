class AppSignature
  include Mongoid::Document

  field :appId, type: String
  field :appName, type: String
  field :subject, type: String
  field :subjectMD5, type: String
  field :signature, type: String
  field :signatureMD5, type: String
  field :enabled, type: Boolean, default: true
  include Mongoid::Timestamps

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def v_subject
    self.subject
  end

  def v_subject=(value)
    self.subject = value.strip
    self.subjectMD5 = Digest::MD5::hexdigest(self.subject)
  end

  def v_signature
    self.signature
  end

  def v_signature=(value)
    self.signature = value.strip
    self.signatureMD5 =Digest::MD5::hexdigest(self.signature)
  end


end