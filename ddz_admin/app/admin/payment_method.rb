ActiveAdmin.register PaymentMethod do

  permit_params do
    permitted = []
    permitted << :methodId
    permitted << :methodName
    permitted << :description
    permitted << :enabled
    permitted << :config_hash
    permitted
  end

  index do
    selectable_column
    id_column
    column :methodId
    column :methodName
    column :description
    column :enabled
    column :config_hash
    column :createAt
    column :updateAt
    actions
  end

  filter :methodId
  filter :methodName
  filter :description
  filter :enabled

  form do |f|
    f.inputs "Payment Method Details" do
      f.input :methodId
      f.input :methodName
      f.input :description
      f.input :enabled, as: :boolean
      f.input :config_hash, as: :text

    end
    f.actions
  end

  show do

    attributes_table do
      row :id
      row :methodId
      row :methodName
      row :description
      row :enabled
      row :config_hash
      row :createdAt
      row :updatedAt
    end

    panel "Packages" do
      table_for resource.packagePayments do
        column "pp_id" do |pp| link_to "pp", admin_package_payment_path(pp) end

        column "Package", :package

        column "Payment Code", :paymentCode

        column "Package Name" do |pp|
          pp.packageName || pp.package.packageName
        end

        column "Price" do |pp|
          pp.price || pp.package.price
        end

        column "Actual Price" do |pp|
          pp.actual_price || pp.package.price
        end

        column "Description" do |pp|
          pp.description || pp.package.packageDesc
        end

        column "Enabled", :enabled
      end
    end

    active_admin_comments

  end

end
