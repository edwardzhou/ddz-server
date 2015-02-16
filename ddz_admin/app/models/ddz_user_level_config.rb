class DdzUserLevelConfig
  include Mongoid::Document

  field :level_name, type: String
  field :max_coins, type: Integer
  field :min_coins, type: Integer
  include Mongoid::Timestamps
  # field :createdAt, type: Date, default: ->{ Time.now }
  # field :updatedAt, type: Date, default: ->{ Time.now }

end