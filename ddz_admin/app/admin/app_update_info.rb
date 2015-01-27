ActiveAdmin.register AppUpdateInfo do
  permit_params do
    permitted = []
    permitted << :appVersion
    permitted << :resVersion
    permitted << :enabled
    permitted << :zipFile
    permitted
  end

  index do
    selectable_column
    id_column
    column :appVersion
    column :resVersion
    column :enabled
    column :versionInfo
    column :created_at
    column :updated_at
    actions
  end

  filter :appVersion
  filter :resVersion
  filter :enabled

  form(:html => { :multipart => true }) do |f|
    f.inputs "Channel Details" do
      f.input :appVersion, required: true
      f.input :resVersion, required: true
      f.input :enabled
      f.input :zipFile, as: :file, required: true
    end
    f.actions
  end
end
