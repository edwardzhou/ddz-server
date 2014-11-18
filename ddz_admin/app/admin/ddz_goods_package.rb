ActiveAdmin.register DdzGoodsPackage do

  collection_action :refresh_packages, :method => :get do
    # Do some CSV importing work here...
    PubSubEvent.create({
                           eventName: 'reload_cache',
                           eventData: {reloadTarget: 'packages'},
                           active: 1
                       })
    redirect_to({:action => :index}, {:notice => "Post Packages refresh event successfully!"})
  end

  sidebar :operation do
    ul do
      li link_to "Refresh Packages in GAME SERVER", refresh_packages_admin_ddz_goods_packages_path
    end
  end


  permit_params do
    permitted = []
    permitted << :packageId
    permitted << :packageName
    permitted << :packageDesc
    permitted << :packageType
    permitted << :packageIcon
    permitted << :price
    permitted << :enabled
    permitted << :sortIndex
    permitted
  end

  index do
    selectable_column
    id_column
    column :packageId
    column :packageName
    column :packageDesc
    column :packageType
    column :packageIcon
    column :price
    column :enabled
    column :sortIndex
    column :createdAt
    column :updatedAt
    actions
  end

  filter :packageId
  filter :packageName
  filter :packageDesc
  filter :packageType

  form do |f|
    f.inputs "DdzGoodsPackage Details" do
      f.input :packageId
      f.input :packageName
      f.input :packageDesc
      f.input :packageType
      f.input :packageIcon
      f.input :price
      f.input :enabled
      #f.input :goodsProps
      f.input :sortIndex
    end
    f.actions
  end

end
