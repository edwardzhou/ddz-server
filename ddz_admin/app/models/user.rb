class User
  include Mongoid::Document

  field :userId, type: Integer
  field :nickName, type: String
  field :mobileNo, type: String
  field :email, type: String
  field :headIcon, type: String
  field :gender, type: String
  field :appid, type: Integer
  field :appVersion, type: String
  field :resVersion, type: String
  field :robot, type: Boolean, default: false
  field :robot_busy, type: Boolean, default: false
  field :locked, type: Boolean, default: false
  field :lockedAt, type: DateTime
  field :comment, type: String

  field :createAt, type: DateTime, default: ->{ Time.now }
  field :updateAt, type: DateTime, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end
end