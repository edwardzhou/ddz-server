class BankruptSaveTemplates
   include Mongoid::Document
   field :count, type: Integer
   field :threshold, type: Integer
   field :save_detail, type: Hash, default: ->{ {:_placeholder => 0} }
   include Mongoid::Timestamps
   # field :createdAt, type: Date, default: ->{ Time.now }
   # field :updatedAt, type: Date, default: ->{ Time.now }

    def save_detail_hash
        self.save_detail.to_json
    end

    def save_detail_hash=(value)
        self.save_detail = JSON.parse(value)
    end
end