ActiveAdmin.register PaymentMethod do

  permit_params do
    permitted = []
    permitted << :methodId
    permitted << :methodName
    permitted << :description
    permitted << :enabled
    permitted << :config
    permitted
  end

  index do
    selectable_column
    id_column
    column :methodId
    column :methodName
    column :description
    column :enabled
    column :config
    column :createAt
    column :updateAt
    actions
  end

  filter :roomId
  filter :roomName
  filter :roomDesc
  filter :state

  form do |f|
    f.inputs "Payment Method Details" do
      f.input :methodId
      f.input :methodName
      f.input :description
      f.input :enabled
    end
    f.actions
  end
end
