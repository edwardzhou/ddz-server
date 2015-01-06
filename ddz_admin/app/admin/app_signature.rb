ActiveAdmin.register AppSignature do
  permit_params do

    permitted = []
    permitted << :appId
    permitted << :appName
    permitted << :v_subject
    permitted << :v_signature
    permitted << :enabled
    permitted
  end

  index do
    selectable_column
    id_column
    column :appId
    column :appName
    column :subject
    column :subjectMD5
    column :signatureMD5
    column :enabled
    column :created_at
    column :updated_at
    actions
  end

  filter :appId
  filter :appName
  filter :subject
  filter :subjectMD5
  filter :signatureMD5
  filter :enabled

  form do |f|
    f.inputs "App Signature Details" do
      f.input :appId, required: true
      f.input :appName, required: true
      f.input :v_subject, required: true
      f.input :subjectMD5, input_html: {readonly: true}
      f.input :v_signature, as: :text, required: true
      f.input :signatureMD5, input_html: {readonly: true}
      f.input :enabled
    end
    f.actions
  end

end
