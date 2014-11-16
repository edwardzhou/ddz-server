ActiveAdmin.register Channel do
  permit_params do
    permitted = []
    permitted << :channelId
    permitted << :channelName
    permitted << :description
    permitted << :enabled
    permitted
  end

  index do
    selectable_column
    id_column
    column :channelId
    column :channelName
    column :description
    column :enabled
    column :createAt
    column :updateAt
    actions
  end

  filter :channelId
  filter :channelName
  filter :description
  filter :enabled

  form do |f|
    f.inputs "Channel Details" do
      f.input :channelId
      f.input :channelName
      f.input :description
      f.input :enabled
    end
    f.actions
  end

end
