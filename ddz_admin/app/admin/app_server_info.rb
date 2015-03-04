ActiveAdmin.register AppServerInfo do
  permit_params do

    permitted = []
    permitted << :appPkgName
    permitted << :appName
    permitted << :updateVersionUrl
    permitted << :updateManifestUrl
    permitted << :gameServers_hash
    permitted << :enabled
    permitted
  end

  index do
    selectable_column
    id_column
    column :appPkgName
    column :appName
    column :updateVersionUrl
    column :updateManifestUrl
    column :gameServers_hash
    column :enabled
    column :created_at
    column :updated_at
    actions
  end

  filter :appPkgName
  filter :appName
  filter :enabled

  form do |f|
    f.inputs "App Signature Details" do
      f.input :appPkgName, required: true
      f.input :appName, required: true
      f.input :updateVersionUrl, required: true
      f.input :updateManifestUrl, required: true
      f.input :gameServers_hash, required: true, as: :text
      f.input :enabled
    end
    f.actions
  end


end
