class PaymentMethod
  include Mongoid::Document

  has_many :packagePayments, class_name: "PackagePayment", foreign_key: 'paymentMethod_id'
  field :methodId, type: String
  field :methodName, type: String
  field :description, type: String
  field :enabled, type: Boolean, default: true
  field :config, type: Hash, default: ->{ {:_placeholder => 0} }
  field :createdAt, type: DateTime, default: ->{ Time.now }
  field :updatedAt, type: DateTime, default: ->{ Time.now }

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end
end