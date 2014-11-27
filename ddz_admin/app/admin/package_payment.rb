ActiveAdmin.register PackagePayment do

  permit_params do
    permitted = []
    permitted << :package_id
    permitted << :paymentMethod_id
    permitted << :paymentCode
    permitted << :packageName
    permitted << :description
    permitted << :price
    permitted << :actual_price
    permitted << :memo
    permitted << :enabled
    permitted
  end

  index do
    selectable_column
    id_column
    column :package
    column :paymentMethod
    column :paymentCode
    column :packageName
    column :description
    column :price
    column :actual_price
    column :memo
    column :enabled
    column :createAt
    column :updateAt
    actions
  end

  filter :package_id
  filter :paymentMethod_id
  filter :paymentCode
  filter :packageName

  form do |f|
    f.inputs "Package Payment Details" do
      f.input :package_id
      f.input :paymentMethod_id
      f.input :paymentCode
      f.input :packageName
      f.input :description
      f.input :price
      f.input :actual_price
      f.input :memo
      f.input :enabled, as: :boolean
    end
    f.actions
  end
end
