ActiveAdmin.register BrokenSaveTemplates do


permit_params do
    permitted = []
    permitted << :count
    permitted << :threshold
    permitted << :save_detail_hash

    permitted
  end

  index do
    selectable_column
    id_column
    column :count
    column :threshold
    column :save_detail
    column :created_at
    column :updated_at
    actions
  end

  filter :templateId
  filter :count

  form do |f|
    f.inputs "BrokenSaveTemplates Details" do
      f.input :count
      f.input :threshold
      f.input :save_detail_hash, as: :text
    end

    f.actions
  end


end
