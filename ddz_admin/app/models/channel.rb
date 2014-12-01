class Channel
  include Mongoid::Document

  field :channelId, type: Integer
  field :channelName, type: String
  field :description, type: String
  field :paymentMethod_id, type: BSON::ObjectId
  field :enabled, type: Boolean, default: true
  field :createdAt, type: DateTime, default: ->{ Time.now }
  field :updatedAt, type: DateTime, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def paymentMethod(reload=nil)
    unless reload
      @paymentMethod ||= PaymentMethod.where({id: self.paymentMethod_id}).first
    else
      @paymentMethod = PaymentMethod.find_by_id(self.paymentMethod_id)
    end

    @paymentMethod
  end

  def paymentMethod=(value)
    if value.nil? then
      @paymentMethod = nil
      self.paymentMethod_id = nil
    elsif @paymentMethod.nil? or @paymentMethod.id != value.id then
      if value.is_a?(String) then
        value = PaymentMethod.where(id: value).first
      end
      @paymentMethod = value
      self.paymentMethod_id = value.id
    end

    @paymentMethod
  end

  def to_s
    "#{self.channelId} - #{self.channelName}"
  end

end