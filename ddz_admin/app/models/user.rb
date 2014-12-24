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
  has_one :ddzProfile, class_name: "DdzUserProfile"
  belongs_to :channel

  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end
end