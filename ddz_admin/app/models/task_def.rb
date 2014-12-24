class TaskDef
  include Mongoid::Document

  field :taskId, type: String
  field :taskName, type: String
  field :taskDesc, type: String
  field :taskType, type: String
  field :taskIcon, type: String
  field :taskBonusDesc, type: String
  field :sortIndex, type: Integer, default: 255
  field :enabled, type: Boolean, default: true
  field :progress, type: Integer, default: 0
  field :progressDesc, type: String
  field :taskData, type: Hash, default: ->{ {:_placeholder => 0} }
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

  validates :taskId, uniqueness: true, presence: true
  validates :taskName, uniqueness: true, presence: true


  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end


  def taskData_hash
    self.taskData.to_json
  end

  def taskData_hash=(value)
    self.taskData = JSON.parse(value)
  end
end