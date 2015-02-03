ActiveAdmin.register LoginRewardTemplates do


permit_params do
    permitted = []
    permitted << :login_days
    permitted << :reward_detail_hash

    permitted
  end

  index do
    selectable_column
    id_column
    column :login_days
    column :reward_detail
    column :created_at
    column :updated_at
    actions
  end

  filter :templateId
  filter :login_days

  form do |f|
    f.inputs "LoginRewardTemplates Details" do
      f.input :login_days
      f.input :reward_detail_hash, as: :text
    end

    f.actions
  end


end
