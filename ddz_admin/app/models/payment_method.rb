class PaymentMethod
  include Mongoid::Document

  has_many :packagePayments, class_name: "PackagePayment", foreign_key: 'paymentMethod_id'
  field :methodId, type: String
  field :methodName, type: String
  field :description, type: String
  field :enabled, type: Boolean, default: true
  field :config, type: Hash, default: ->{ {:_placeholder => 0} }
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

  has_many :channels, class_name: 'Channel'

  def self.serialize_from_session(key, salt)
    record = to_adapter.get((key[0]["$oid"] rescue nil))
    record if record && record.authenticatable_salt == salt
  end

  def config_hash
    self.config.to_json
  end

  def config_hash=(value)
    self.config = JSON.parse(value)
  end

  def to_s
    "#{self.methodId} - #{self.methodName}"
  end

  def build_package_payments
    DdzGoodsPackage.all.each do |pkg|
      if self.packagePayments.select{|pp| pp.package_id == pkg.id}.size == 0 then
        self.packagePayments.new({package_id: pkg.id,
                                    packageName: pkg.packageName,
                                    description: pkg.packageDesc,
                                    price: pkg.price,
                                    actual_price: pkg.price,
                                    enabled: true
                                   })
      end
    end

    self.save
  end
end