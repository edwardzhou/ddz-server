ActiveAdmin.register DdzUserLevelConfig do

collection_action :refresh_level_config, :method => :get do
    # Do some CSV importing work here...
    PubSubEvent.create({
                           eventName: 'reload_cache',
                           eventData: {reloadTarget: 'level_config'},
                           active: 1
                       })
    redirect_to({:action => :index}, {:notice => "Post level config refresh event successfully!"})
  end

  sidebar :operation do
    ul do
      li link_to "Refresh level config in GAME SERVER", refresh_level_config_admin_ddz_user_level_configs_path
    end
  end

permit_params do
    permitted = []
    permitted << :level_name
    permitted << :min_coins
    permitted << :max_coins
    permitted
  end

  index do
    selectable_column
    id_column
    column :level_name
    column :min_coins
    column :max_coins
    column :created_at
    column :updated_at
    actions
  end

  filter :level_name

  form do |f|
    f.inputs "DdzUserLevelConfig Details" do
      f.input :level_name
      f.input :min_coins
      f.input :max_coins
    end

    f.actions
  end


end
