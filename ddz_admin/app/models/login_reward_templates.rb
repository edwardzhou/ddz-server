class LoginRewardTemplates
   include Mongoid::Document
   field :login_days, type: Integer
   field :reward_detail, type: Hash, default: ->{ {:_placeholder => 0} }
   include Mongoid::Timestamps
   # field :createdAt, type: Date, default: ->{ Time.now }
   # field :updatedAt, type: Date, default: ->{ Time.now }

    def reward_detail_hash
        self.reward_detail.to_json
    end

    def reward_detail_hash=(value)
        self.reward_detail = JSON.parse(value)
    end
end